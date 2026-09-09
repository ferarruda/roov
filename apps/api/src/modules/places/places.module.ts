import { Module } from '@nestjs/common';
import { PlacesController } from './places.controller';
import { PlacesService } from './places.service';
import { PlacesRepository } from './places.repository';

@Module({
  controllers: [PlacesController],
  providers: [PlacesRepository, PlacesService],
  exports: [PlacesRepository, PlacesService],
})
export class PlacesModule {}
