import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type QuestionEntityDocument = HydratedDocument<QuestionEntity>;

export type QuestionStatus =
  | 'open'
  | 'in-review'
  | 'closed'
  | 'delayed'
  | 're-routed'
  | 'hold'
  | 'pae_submitted'
  | 'draft'
  | 'pass'
  | 'duplicate'
  | 'non_agri'
  | 'pending'
  | 'dynamic'
  | 'queue_progress'
  | 'auditor_review'
  | 'dynamic_closed'
  | 'queue_duplicate'
  | 'duplicate_confirmed'
  | 'duplicate_closed';

export type IQuestionPriority = 'low' | 'medium' | 'high' | 'critical';

export type QuestionSource =
  'AJRASAKHA' | 'AGRI_EXPERT' | 'WHATSAPP' | 'OUTREACH';

@Schema({
  collection: 'questions',
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class QuestionEntity {
  @Prop({ type: Types.ObjectId, required: false })
  userId?: Types.ObjectId;

  @Prop({ type: String, required: true, trim: true })
  question!: string;

  @Prop({ type: Types.ObjectId, required: false })
  contextId?: Types.ObjectId;

  @Prop({
    type: String,
    enum: [
      'open',
      'in-review',
      'closed',
      'delayed',
      're-routed',
      'hold',
      'pae_submitted',
      'draft',
      'pass',
      'duplicate',
      'non_agri',
      'pending',
      'dynamic',
      'queue_progress',
      'auditor_review',
      'dynamic_closed',
      'queue_duplicate',
      'duplicate_confirmed',
      'duplicate_closed',
    ],
    default: 'open',
  })
  status!: QuestionStatus;

  @Prop({ type: String, required: false })
  tag?: string;

  @Prop({ type: Number, default: 0 })
  totalAnswersCount!: number;

  @Prop({
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium',
  })
  priority!: IQuestionPriority;

  @Prop({ type: Object, required: false })
  details?: {
    state?: string;
    district?: string;
    crop?: string;
    season?: string;
    domain?: string[];
    normalised_crop?: string;
    tools_used?: string[];
  };

  @Prop({ type: Boolean, default: false })
  isAutoAllocate!: boolean;

  @Prop({
    type: String,
    enum: ['AJRASAKHA', 'AGRI_EXPERT', 'WHATSAPP', 'OUTREACH'],
    default: 'AJRASAKHA',
  })
  source!: QuestionSource;

  @Prop({ type: [Number], default: [] })
  embedding!: number[];

  @Prop({ type: String, required: false })
  aiInitialAnswer?: string;

  @Prop({ type: String, required: false })
  aiApprovedAnswer?: string;

  @Prop({ type: Boolean, default: false })
  isClosed!: boolean;

  @Prop({ type: Date, required: false })
  closedAt?: Date;

  @Prop({ type: Date, required: false })
  passedAt?: Date;

  // Provided by `timestamps: true`
  createdAt!: Date;
  updatedAt!: Date;
}

export const QuestionSchema = SchemaFactory.createForClass(QuestionEntity);

QuestionSchema.virtual('id').get(function () {
  return this._id.toString();
});
