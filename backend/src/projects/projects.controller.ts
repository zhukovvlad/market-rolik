import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { ProjectsService } from './projects.service';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  async create(@Body('userId') userId: string, @Body('title') title: string) {
    // В будущем userId будем брать из JWT токена (req.user.id)
    return this.projectsService.createProject(userId, title);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.projectsService.findOne(id);
  }
}
