import { AuthController } from './auth.controller';
import { InfoController } from './info.controller';
import { PersonalController } from './personal.controller';
import { InitController } from './init.controller';
import { UsuariosController } from './usuarios.controller'
import { dbServer } from '..';


export const usuariosController = new UsuariosController();
export const infoController = new InfoController();
export const authController = new AuthController();
export const personalController = new PersonalController()
export const initController = new InitController()