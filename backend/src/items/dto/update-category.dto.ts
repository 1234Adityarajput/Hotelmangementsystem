import { PartialType } from '@nestjs/swagger';
import { CreateItemCategoryDto } from './create-category.dto';

export class UpdateItemCategoryDto extends PartialType(CreateItemCategoryDto) {}
