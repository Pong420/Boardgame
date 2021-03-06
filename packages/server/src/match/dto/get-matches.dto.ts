import { Param$GetMatches } from '@/typings';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  IsNotEmpty
} from 'class-validator';

export class GetMatchesDto implements Param$GetMatches {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsBoolean()
  @IsOptional()
  @Transform(v => (typeof v === 'string' ? JSON.parse(v) : Boolean(v)))
  isGameover?: boolean;

  @IsNumber()
  @IsOptional()
  @Transform(Number)
  updatedBefore?: number;

  @IsNumber()
  @IsOptional()
  @Transform(Number)
  updatedAfter?: number;
}
