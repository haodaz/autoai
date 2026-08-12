import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import * as ics from 'ics';
import { EventAttributes } from 'ics';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { customerId, to, subject, description, location, startTime, durationMinutes } = await req.json();

    if (!process.env.IMAP_USER || !process.env.IMAP_PASSWORD) {
      return NextResponse.json({ error: 'Email credentials not configured in .env.local' }, { status: 500 });
    }

    const startDate = new Date(startTime);
    if (isNaN(startDate.getTime())) {
      return NextResponse.json({ error: 'Invalid start time' }, { status: 400 });
    }

    const duration = parseInt(durationMinutes) || 30;
    const endDate = new Date(startDate.getTime() + duration * 60000);

    // 1. Check for conflicts
    const overlappingMeeting = await prisma.meeting.findFirst({
      where: {
        status: 'SCHEDULED',
        startTime: { lt: endDate },
        endTime: { gt: startDate },
      }
    });

    if (overlappingMeeting) {
      return NextResponse.json({ error: '时间冲突：该时间段已有安排，请选择其他时间。' }, { status: 409 });
    }

    // 2. Generate ICS
    const event: EventAttributes = {
      start: [startDate.getFullYear(), startDate.getMonth() + 1, startDate.getDate(), startDate.getHours(), startDate.getMinutes()],
      duration: { minutes: duration },
      title: subject,
      description: description || 'Admissions Interview / Meeting',
      location: location || 'Online Meeting',
      url: location && location.startsWith('http') ? location : undefined,
      status: 'CONFIRMED',
      busyStatus: 'BUSY',
      organizer: { name: 'Admissions Team', email: process.env.IMAP_USER },
      attendees: [
        { name: 'Student/Parent', email: to, rsvp: true, partstat: 'NEEDS-ACTION', role: 'REQ-PARTICIPANT' }
      ]
    };

    const { error: icsError, value: icsContent } = ics.createEvent(event);
    if (icsError || !icsContent) {
      console.error('ICS Error:', icsError);
      return NextResponse.json({ error: 'Failed to generate calendar invite' }, { status: 500 });
    }

    // 3. Send Email
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.IMAP_USER, pass: process.env.IMAP_PASSWORD },
    });

    const info = await transporter.sendMail({
      from: `"Admissions AI" <${process.env.IMAP_USER}>`,
      to,
      subject,
      text: description || 'Please see the attached calendar invite for our upcoming meeting.',
      alternatives: [
        { contentType: 'text/calendar; charset="utf-8"; method=REQUEST', content: icsContent.toString() }
      ]
    });

    // 4. Save to Database
    await prisma.meeting.create({
      data: {
        customerId: customerId || null,
        subject,
        startTime: startDate,
        endTime: endDate,
        location,
        description,
        status: 'SCHEDULED'
      }
    });

    return NextResponse.json({ success: true, messageId: info.messageId });
  } catch (error) {
    console.error('Calendar Invite Error:', error);
    return NextResponse.json({ error: 'Failed to send calendar invite', details: String(error) }, { status: 500 });
  }
}
