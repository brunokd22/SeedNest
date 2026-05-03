import type { PublicUser } from './user';

export enum IssueType {
  REPLACEMENT_REQUEST = 'REPLACEMENT_REQUEST',
  QUERY               = 'QUERY',
  COMPLAINT           = 'COMPLAINT',
  GENERAL_REQUEST     = 'GENERAL_REQUEST',
}

export enum IssueStatus {
  OPEN        = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED    = 'RESOLVED',
  CLOSED      = 'CLOSED',
}

export type IssueComment = {
  id: string;
  issueId: string;
  authorId: string;
  body: string;
  createdAt: Date;
  updatedAt: Date;
};

export type Issue = {
  id: string;
  orderId: string | null;
  seedlingId: string | null;
  customerId: string;
  nurseryId: string;
  title: string;
  description: string;
  type: IssueType;
  status: IssueStatus;
  createdAt: Date;
  updatedAt: Date;
};

export type IssueWithComments = Issue & {
  comments: (IssueComment & { author: PublicUser })[];
};
