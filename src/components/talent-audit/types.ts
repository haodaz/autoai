export interface FactItem {
  status?: 'match' | 'mismatch' | 'manual_review';
  title: string;
  confidence: 'High Confidence' | 'Medium Confidence' | 'Low Confidence';
  source: string;
  method: string;
  desc: string;
  claimText: string;
  evidence: string[];
  matchedFields?: string[];
  mismatchedFields?: string[];
  internetData?: string;
  score: number;
  isPartner?: boolean;
  rawDataLog?: string;
}

export interface EducationItem {
  school: string;
  period: string;
  degree: string;
  major?: string;
}

export interface ExperienceItem {
  company: string;
  period: string;
  role: string;
  description?: string;
}

export interface PublicationItem {
  title: string;
  journal: string;
  citations?: number;
  year?: string;
}

export interface ExamItem {
  name: string;
  date: string;
  score: string;
  details?: string;
}

export interface AwardItem {
  name: string;
  date?: string;
  organization?: string;
}

export interface AffiliationItem {
  role: string;
  organization: string;
  period?: string;
}

export interface ResumeData {
  name: string;
  title?: string;
  subtitle?: string;
  summary?: string;
  chineseName?: string;
  englishName?: string;
  primaryInstitution?: string;
  personalStatement?: string;
  education?: EducationItem[];
  experience?: ExperienceItem[];
  publications?: PublicationItem[];
  patents?: Array<{name: string, role?: string}>;
  projects?: Array<{name: string, role?: string, keywords?: string}>;
  skills?: string[];
  exams?: ExamItem[];
  awards?: AwardItem[];
  affiliations?: AffiliationItem[];
}

export interface ResumeStruct {
  name: string;
  title?: string;
  subtitle?: string;
  summary?: string;
  chineseName?: string;
  englishName?: string;
  primaryInstitution?: string;
  personalStatement?: string;
  education: EducationItem[];
  experience: ExperienceItem[];
  publications?: PublicationItem[];
  patents?: Array<{name: string, role?: string}>;
  projects?: Array<{name: string, role?: string, keywords?: string}>;
  skills?: string[];
  exams?: ExamItem[];
  awards?: AwardItem[];
  affiliations?: AffiliationItem[];
}

export interface DimensionEval {
  score: number;
  summary: string;
  items: Array<{ point: string; judgment: string }>;
}

export interface ValueEvaluationData {
  education_eval: DimensionEval;
  research_eval: DimensionEval;
  industry_eval: DimensionEval;
  leadership_eval?: DimensionEval;
  innovation_eval?: DimensionEval;
  social_eval?: DimensionEval;
  overall_summary: string;
  industry_impacts?: { industry: string; impact: string }[];
  action_suggestions: string[];
  isUnverified?: boolean;
}

export interface TalentAuditReportData {
  resume: ResumeStruct;
  stats: {
    match: number;
    mismatch: number;
    manual_review: number;
  };
  overallEvaluation: {
    level: string;
    text: string;
  };
  factItems: FactItem[];
  valueEvaluation?: ValueEvaluationData;
  /** 各渠道原始数据（验真时收集） */
  sourceData?: {
    texts?: string[];      // 爬虫直接抓取的全网搜索原始文本
    pingfang?: any;        // 平方学者库完整人才对象
    orcid?: {              // ORCID 学者档案
      employments?: Array<{ org: string; role: string; dept: string }>;
      educations?: Array<{ org: string; role: string; dept: string }>;
      works?: Array<{ title: string; type: string }>;
      englishName?: string;
    };
    orcid_url?: string;
    scholar?: {            // OpenAlex 学术数据
      display_name?: string;
      cited_by_count?: number;
      works_count?: number;
      summary_stats?: { h_index?: number; cited_by_count?: number };
      last_known_institutions?: Array<{ display_name: string }>;
      topics?: Array<{ display_name: string }>;
    };
    scholar_url?: string;
    wikipedia?: {          // Wikipedia / 百度百科原文
      biography?: string;
      url?: string;
      source_type?: 'wikipedia' | 'baike';
    };
  };
}
