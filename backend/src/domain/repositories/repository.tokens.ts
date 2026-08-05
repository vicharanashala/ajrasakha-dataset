/**
 * String tokens used for binding repository implementations to the DI container.
 * Kept in the domain layer (not infrastructure) so the application layer can
 * reference them without depending on NestJS or Mongoose.
 */
export const USER_REPOSITORY = 'USER_REPOSITORY';
export const QUESTION_REPOSITORY = 'QUESTION_REPOSITORY';
export const ANSWER_REPOSITORY = 'ANSWER_REPOSITORY';
export const FEEDBACK_REPOSITORY = 'FEEDBACK_REPOSITORY';
export const API_KEY_REPOSITORY = 'API_KEY_REPOSITORY';
