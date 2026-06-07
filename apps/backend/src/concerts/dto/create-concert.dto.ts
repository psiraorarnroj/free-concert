import { IsInt, IsNotEmpty, IsString, Max, MaxLength, Min } from 'class-validator';

export class CreateConcertDto {
  @IsString()
  @IsNotEmpty({ message: 'Concert name is required' })
  @MaxLength(200)
  name: string;

  @IsString()
  @IsNotEmpty({ message: 'Description is required' })
  @MaxLength(2000)
  description: string;

  @IsInt({ message: 'Total seats must be an integer' })
  @Min(1, { message: 'Total seats must be at least 1' })
  @Max(1_000_000)
  totalSeats: number;
}
