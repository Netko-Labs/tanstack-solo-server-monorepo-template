import type { Attributes } from '@opentelemetry/api'
import type { LogRecordProcessor, ReadWriteLogRecord } from '@opentelemetry/sdk-logs'
import type { Span, SpanProcessor } from '@opentelemetry/sdk-trace-base'

/** code-whiskers reads only `service.name` from the resource, so release and env ride on every span. */
export class AttributeSpanProcessor implements SpanProcessor {
  constructor(private readonly attributes: Attributes) {}

  onStart(span: Span): void {
    span.setAttributes(this.attributes)
  }

  onEnd(): void {}

  async forceFlush(): Promise<void> {}

  async shutdown(): Promise<void> {}
}

/** The same attributes on every log record, for the same reason. */
export class AttributeLogProcessor implements LogRecordProcessor {
  constructor(private readonly attributes: Attributes) {}

  onEmit(record: ReadWriteLogRecord): void {
    record.setAttributes(this.attributes)
  }

  async forceFlush(): Promise<void> {}

  async shutdown(): Promise<void> {}
}
