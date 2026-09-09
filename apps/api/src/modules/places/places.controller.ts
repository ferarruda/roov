import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { PlacesService, type PlacesPage, type PublicPlace } from './places.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/types/authenticated-user';
import { CreatePlaceDto } from './dto/create-place.dto';
import { UpdatePlaceDto } from './dto/update-place.dto';
import { ListPlacesQueryDto } from './dto/list-places.query.dto';

/** Sem `@Public()` em nenhuma rota — nasce protegida, como todo o resto do sistema. */
@Controller('places')
export class PlacesController {
  constructor(private readonly places: PlacesService) {}

  /** POST /v1/places */
  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreatePlaceDto,
  ): Promise<PublicPlace> {
    return this.places.create(user.id, dto);
  }

  /** GET /v1/places — paginação por cursor, filtro opcional por categoria. */
  @Get()
  list(@Query() query: ListPlacesQueryDto): Promise<PlacesPage> {
    return this.places.list(query);
  }

  /** GET /v1/places/:id */
  @Get(':id')
  findById(@Param('id') id: string): Promise<PublicPlace> {
    return this.places.findById(id);
  }

  /** PATCH /v1/places/:id — só quem cadastrou pode editar. */
  @Patch(':id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdatePlaceDto,
  ): Promise<PublicPlace> {
    return this.places.update(user.id, id, dto);
  }
}
