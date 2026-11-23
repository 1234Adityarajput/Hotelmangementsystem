import { Module } from '@nestjs/common';
import { ItemsController } from './items.controller';
import { ItemCategoriesController } from './item-categories.controller';
import { BookingItemsController } from './booking-items.controller';
import { ItemsService } from './items.service';

@Module({
  controllers: [ItemsController, ItemCategoriesController, BookingItemsController],
  providers: [ItemsService],
  exports: [ItemsService],
})
export class ItemsModule {}
