import { Controller, Get } from "@nestjs/common";
import {
  HealthCheck,
  HealthCheckResult,
  HealthCheckService,
  MemoryHealthIndicator,
} from "@nestjs/terminus";

const HEAP_LIMIT_BYTES = 512 * 1024 * 1024;

@Controller("health")
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly memory: MemoryHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check(): Promise<HealthCheckResult> {
    return this.health.check([
      () => this.memory.checkHeap("memory_heap", HEAP_LIMIT_BYTES),
    ]);
  }
}
