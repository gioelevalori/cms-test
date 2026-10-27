import { Module } from '@nestjs/common';
import { ChangesController } from './changes.controller';
import { ChangesService } from './changes.service';
import { InterpreterService } from '../interpreter/interpreter.service';

@Module({ controllers: [ChangesController], providers: [ChangesService, InterpreterService], exports: [ChangesService] })
export class ChangesModule {}
