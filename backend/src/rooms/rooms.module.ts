import { Module } from '@nestjs/common';
import { RoomsController } from './rooms.controller';
import { RoomsService } from './rooms.service';
import { RoomTypesController } from './room-types.controller';
import { RoomTypesService } from './room-types.service';

@Module({
  controllers: [RoomsController, RoomTypesController],
  providers: [RoomsService, RoomTypesService],
  exports: [RoomsService, RoomTypesService],
})
export class RoomsModule {}
