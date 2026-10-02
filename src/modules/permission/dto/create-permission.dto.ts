import { IsOptional, IsString, Matches, MinLength } from 'class-validator';

export class CreatePermissionDto {
  @IsString()
  @MinLength(2)
  @Matches(/^[a-z0-9._-]+$/, {
    message: 'code must contain only lowercase letters, numbers, dots, underscores or hyphens',
  })
  code!: string;

  @IsString()
  @MinLength(2)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;
}
