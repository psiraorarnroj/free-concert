import { Module } from '@nestjs/common';
import { ConcertsService } from './concerts.service';
import { ConcertsController } from './concerts.controller';

@Module({
  providers: [ConcertsService],
  controllers: [ConcertsController],
  exports: [ConcertsService],
})
export class ConcertsModule {}
