import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtGuard } from '../auth/jwt.guard';
import { AuthUser, CurrentUser } from '../common/current-user.decorator';
import { ChangesService } from './changes.service';
import { ChatMessageDto, DirectChangeDto } from './changes.dto';

@Controller()
@UseGuards(JwtGuard)
export class ChangesController {
  constructor(private readonly changes: ChangesService) {}

  @Post('businesses/:businessId/chat')
  chat(@CurrentUser() u: AuthUser, @Param('businessId') businessId: string, @Body() dto: ChatMessageDto) {
    return this.changes.proposeFromMessage(u.id, businessId, dto.message);
  }

  @Post('businesses/:businessId/changes')
  direct(@CurrentUser() u: AuthUser, @Param('businessId') businessId: string, @Body() dto: DirectChangeDto) {
    return this.changes.proposeOps(u.id, businessId, dto.ops);
  }

  @Get('businesses/:businessId/changes')
  list(@CurrentUser() u: AuthUser, @Param('businessId') businessId: string) {
    return this.changes.list(u.id, businessId);
  }

  @Post('changes/:changeId/confirm')
  confirm(@CurrentUser() u: AuthUser, @Param('changeId') changeId: string) {
    return this.changes.confirm(u.id, changeId);
  }

  @Post('changes/:changeId/reject')
  reject(@CurrentUser() u: AuthUser, @Param('changeId') changeId: string) {
    return this.changes.reject(u.id, changeId);
  }

  @Post('changes/:changeId/undo')
  undo(@CurrentUser() u: AuthUser, @Param('changeId') changeId: string) {
    return this.changes.undo(u.id, changeId);
  }
}
