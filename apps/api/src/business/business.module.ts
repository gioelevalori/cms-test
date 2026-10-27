import { Global, Module } from '@nestjs/common';
import { BusinessController } from './business.controller';
import { BusinessService } from './business.service';
import { BusinessDataService } from './business-data.service';
import { MembershipService } from './membership.service';

@Global()
@Module({
  controllers: [BusinessController],
  providers: [BusinessService, BusinessDataService, MembershipService],
  exports: [BusinessDataService, MembershipService],
})
export class BusinessModule {}
