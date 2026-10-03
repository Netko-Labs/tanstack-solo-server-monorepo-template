import type { TodoErrorCode } from '@temp-repo/studio-domain'
import { ServiceError } from '../../shared'

export class TodoError extends ServiceError<TodoErrorCode> {}
