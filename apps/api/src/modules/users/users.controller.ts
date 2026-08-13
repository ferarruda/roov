import { Body, Controller, Patch } from '@nestjs/common';
import { UsersService, type PublicUser } from './users.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/types/authenticated-user';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  /**
   * PATCH /v1/users/me
   *
   * Sem `@Public()`: rota nasce protegida, como toda rota do sistema.
   */
  @Patch('me')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateUserDto,
  ): Promise<PublicUser> {
    return this.users.update(user.id, dto);
  }
}
