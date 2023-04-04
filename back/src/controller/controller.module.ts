import { AuthController } from './auth.controller';
import { InfoController } from './info.controller';
import { PersonalController } from './personal.controller';
import { InitController } from './init.controller';


export const infoController = new InfoController();
export const authController = new AuthController();
export const personalController = new PersonalController()
export const initController = new InitController()