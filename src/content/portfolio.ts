import { sourcedText, resumeSource } from './provenance.ts';
import {
  siteIdentity,
  type PortfolioContent,
} from '../domain/identity.ts';
import { projectRecords } from './projects.ts';

export const ownerApprovalRequiredReason =
  'owner-approved-source-required' as const;

/** A required factual field for which no owner-approved source is available. */
export interface UnresolvedRequiredContent {
  readonly kind: 'unresolved';
  readonly reason: typeof ownerApprovalRequiredReason;
}

/** A complete source field whose value already satisfies the domain contract. */
export interface VerifiedRequiredContent<T> {
  readonly kind: 'verified';
  readonly value: T;
}

/**
 * Source-level state used before validation produces renderable
 * PortfolioContent. An unresolved field cannot be mistaken for visible copy.
 */
export type RequiredContentSource<T> =
  | VerifiedRequiredContent<T>
  | UnresolvedRequiredContent;

export interface CompleteProjectCollection {
  readonly kind: 'complete';
}

export type ProjectCollectionStatus =
  | CompleteProjectCollection
  | UnresolvedRequiredContent;

/**
 * The one structured source consumed by the content validator.
 * It intentionally differs from PortfolioContent while factual inputs are
 * unresolved, preventing the UI from receiving fabricated fallback values.
 */
export interface PortfolioContentSource {
  readonly identity: PortfolioContent['identity'];
  readonly about: RequiredContentSource<PortfolioContent['about']>;
  readonly skillCategories: RequiredContentSource<
    PortfolioContent['skillCategories']
  >;
  readonly journeyStages: RequiredContentSource<
    PortfolioContent['journeyStages']
  >;
  readonly superpowerStatement: RequiredContentSource<
    PortfolioContent['superpowerStatement']
  >;
  readonly projects: typeof projectRecords;
  readonly projectCollectionStatus: ProjectCollectionStatus;
}

const text = (value: string) => sourcedText(value, resumeSource);
const about = {
 teaching: text('I spent over a decade teaching high-school students in Türkiye. Teaching taught me to explain complex ideas clearly, adapt to different learning needs, and help people build confidence through understanding.'),
 cloudEngineering: text('I am now pursuing a Master of Science in Information at the University of Michigan. My technical experience includes a DevOps internship at Ectios and hands-on work with AWS, serverless applications, infrastructure tools and CI/CD.'),
 artificialIntelligence: text('I explore AI through projects in learning, multilingual mentoring, Kurdish news and audio, and commerce. These are ongoing development projects, with their limits and implementation status described openly.'),
 connection: text('Through RojKilim and Rêya Sine Atlas, I also connect entrepreneurship and technology with weaving and cultural heritage. Across these areas, my focus is helping people understand, learn and connect.')
} satisfies PortfolioContent['about'];
const skillCategories = [
 {id:'education',label:text('Teaching & communication'),skills:['Lesson design','Adapting instruction','Student mentoring','Technical documentation','Explaining complex ideas'].map(text)},
 {id:'programming',label:text('Programming & data'),skills:['Python','TypeScript','REST APIs','GraphQL','PostgreSQL','DynamoDB','Prisma ORM'].map(text)},
 {id:'cloud',label:text('Cloud & delivery tools'),skills:['AWS Lambda','Amazon S3','API Gateway','Amazon Cognito','Amazon Bedrock','AWS SAM','Terraform','Docker','Kubernetes','GitHub Actions'].map(text)},
 {id:'practice',label:text('Entrepreneurship & cultural projects'),skills:['E-commerce','Cultural storytelling','Learning tools','Kurdish language and heritage projects'].map(text)}
] satisfies PortfolioContent['skillCategories'];
const journeyStages = [
 {id:'teaching',label:'Teaching',content:text('For over a decade, I taught high-school students in Türkiye, designed lessons, adapted instruction and mentored learners. That experience shapes how I explain ideas and approach the needs of people using technology.')},
 {id:'cloud',label:'Cloud',content:text('My transition into technology includes a DevOps internship at Ectios and work with serverless applications, authentication, infrastructure automation and CI/CD. I am building on that experience through my MSI at Michigan.')},
 {id:'ai',label:'AI',content:text('I am developing AI and learning projects including RojAnda, RojBer, Dengbej AI and RojAI. My interest is in tools that support learning, language and practical work, while being honest about what has been tested.')}
] satisfies PortfolioContent['journeyStages'];
export const portfolioContentSource = Object.freeze({
 identity: siteIdentity,
 about: {kind:'verified' as const,value:about},
 skillCategories: {kind:'verified' as const,value:skillCategories},
 journeyStages: {kind:'verified' as const,value:journeyStages},
 superpowerStatement: {kind:'verified' as const,value:text('My superpower is making complex ideas understandable—and bringing an educator’s perspective to the technology I build.')},
 projects: projectRecords,
 projectCollectionStatus: {kind:'complete' as const}
}) satisfies PortfolioContentSource;
