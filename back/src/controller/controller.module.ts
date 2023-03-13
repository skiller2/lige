import { AuthController } from './auth.controller';
import { InfoController } from './info.controller';
import { UsuariosController } from './usuarios.controller'


export const usuariosController = new UsuariosController();
export const infoController = new InfoController();
export const authController = new AuthController();
