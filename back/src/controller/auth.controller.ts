import bcryptjs from "bcryptjs";
//import { SearchOptions, createClient, SearchEntry,Control } from "ldapjs";
import { Attribute, Change, Client, InvalidCredentialsError } from 'ldapts';
import type { SearchOptions } from 'ldapts';

import jsonwebtoken, { } from "jsonwebtoken";
import { getConnection } from "../data-source.ts";
import type { NextFunction, Request } from "express";

import { BaseController, ClientException } from "./base.controller.ts";

export class AuthController extends BaseController {

  encodePassword(password) {
    return Buffer.from('"' + password + '"', 'utf16le').toString();
  }

  /**
   * Para cambiar la password vencida necesito tener credendiales particulares con privilegios para realizar esta acción
   * uso LDAP_USERNAME y LDAP_PASSWORD del .env
   * el parámetro DN debe ser 'CN=nombre,OU=dominio1,DC=dominio2,DC=dominio3,DC=local'
   */

  async changePassword(dn: string, passwordOld: string, passwordNew: string) {
    const url = process.env.LDAP_URL ? process.env.LDAP_URL : "";

    const ldap_username = process.env.LDAP_USERNAME ? process.env.LDAP_USERNAME : "";
    const ldap_passowrd = process.env.LDAP_PASSWORD ? process.env.LDAP_PASSWORD : "";

    const con = new Client({
      url: url,
      timeout: 0,
      connectTimeout: 0,
      tlsOptions: {
        minVersion: 'TLSv1.2',
        rejectUnauthorized: false,
      },
      strictDN: false,
    });

    await con.bind(ldap_username, ldap_passowrd);
    await con.modify(dn, [
      //          new Change({ operation: 'replace', modification: new Attribute({ type: 'unicodePwd', values: [this.encodePassword('Alf.Oro.23')] }) }),
      //          new Change({ operation: 'delete',  modification: new Attribute({ type: 'unicodePwd', values: [this.encodePassword(password)    ] }) }),
      //          new Change({ operation: 'add',     modification: new Attribute({ type: 'unicodePwd', values: [this.encodePassword('Alf.Oro.23')  ] }) }),
      new Change({ operation: 'delete', modification: new Attribute({ type: 'userPassword', values: [passwordOld] }) }),
      new Change({ operation: 'add', modification: new Attribute({ type: 'userPassword', values: [passwordNew] }) }),
    ])


    //        const resexop = await con.exop('1.3.6.1.4.1.4203.1.11.3'); // throws error 'toString' of null
    /*
    var LDAP_EXOP_X_MODIFY_PASSWD = '1.3.6.1.4.1.4203.1.11.1';
    var LDAP_TAG_EXOP_X_MODIFY_PASSWD_ID = 0x80;
    var LDAP_TAG_EXOP_X_MODIFY_PASSWD_OLD = 0x81;
    var LDAP_TAG_EXOP_X_MODIFY_PASSWD_NEW = 0x82;
    var writer = new Ber.Writer();
    writer.startSequence();
    writer.writeByte(LDAP_TAG_EXOP_X_MODIFY_PASSWD_ID);
    writer.writeBuffer(new Buffer(dn), Ber.OctetString);
    writer.writeByte(LDAP_TAG_EXOP_X_MODIFY_PASSWD_OLD);
    writer.writeBuffer(new Buffer(op), Ber.OctetString);
    writer.writeByte(LDAP_TAG_EXOP_X_MODIFY_PASSWD_NEW);
    writer.writeBuffer(new Buffer(np), Ber.OctetString);
    writer.endSequence();
    */


  }

  async authUser(user: string, password: string) {
    const url = process.env.LDAP_URL ? process.env.LDAP_URL : "";
    const defdomain = process.env.LDAP_AUTH_DOMAIN ? process.env.LDAP_AUTH_DOMAIN : "finanzas";
    const con = new Client({
      url: url,
      timeout: 0,
      connectTimeout: 0,
      tlsOptions: {
        minVersion: 'TLSv1.2',
        rejectUnauthorized: false,
      },
      strictDN: false,
    });

    if (user == null)  //Valida undefined or null
      throw new ClientException("Usuario vacío")

    if (password == null) //Valida undefined or null
      throw new ClientException("Contraseña vacía")

    const usernamenodomain = user.split("@")[0];

    try {
      await con.bind(usernamenodomain + '@' + defdomain, password);

      // Debería usarse esta opción
      // const { value } = await con.exop('1.3.6.1.4.1.4203.1.11.3'); //WHO AM I
      // Pero no funciona con AD

      const ldapsearch = process.env.LDAP_SEARCH ? process.env.LDAP_SEARCH : "";
      const opts: SearchOptions = {
        filter: `(&(objectClass=user)(sAMAccountName=${usernamenodomain}))`,
        //          filter: `(objectClass=user)`,
        //          scope: "sub",
        //        attributes: ['dn', 'sn', 'cn', 'mail', 'name', 'sAMAccountName'],
        paged: false,
        sizeLimit: 0,
      };

      const { searchEntries, searchReferences } = await con.search(ldapsearch, opts)

      const dn = (searchEntries[0].dn) ? searchEntries[0].dn : ""
      const groups = (searchEntries[0].memberOf) ? searchEntries[0].memberOf : []
      const sAMAccountName = (searchEntries[0].sAMAccountName) ? searchEntries[0].sAMAccountName : ''
      const email = (searchEntries[0].email) ? searchEntries[0].email : ''
      const name = (searchEntries[0].name) ? searchEntries[0].name : ''
      const description = (searchEntries[0].description) ? searchEntries[0].description : ''

      await con.unbind();

      return { dn, groups, sAMAccountName, email, name, description, userName: usernamenodomain.toLowerCase() }

    } catch (err) {
      if (err instanceof InvalidCredentialsError) {
        const extended = err.message.match(/AcceptSecurityContext (.*), data (.*),/)

        /*
            525	user not found
            52e	invalid credentials
            530	not permitted to logon at this time
            531	not permitted to logon at this workstation
            532	password expired
            533
            534	account disabled
            The user has not been granted the requested logon type at this machine
            701	account expired
            773	user must reset password
            775	user account locked
         */
        switch (extended[2]) {
          case '532':
            throw new ClientException("Contraseña vencida, debe actualizar", err.message)
            break;
          case '52e':
            throw new ClientException("Las credenciales ingresadas no son válidas", err.message)
            break;
          case '773':
            throw new ClientException("Requiere cambio de contraseña", err.message)
            break;

          default:
            break;
        }
      }
      throw err
    }
  }

  encryptPassword(password: string) {
    const salt = bcryptjs.getSalt("10");
    //    const salt = "10";
    return bcryptjs.hash(password, salt);
  }

  comparePassword(password: string, passwordReceived: string) {
    return bcryptjs.compare(password, passwordReceived);
  }

  async signin(req: Request, res: any, next: NextFunction) {
    const { userName, password } = req.body;
    const queryRunner = await getConnection();

    try {
      let user: any = await this.authUser(userName, password)
      await queryRunner.connect();

      const persona_cuit = Number(user.description)


      let result = await queryRunner.query(
        `SELECT per.PersonalId
        FROM Personal per
        JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = per.PersonalId AND cuit.PersonalCUITCUILId = ( SELECT MAX(cuitmax.PersonalCUITCUILId) FROM PersonalCUITCUIL cuitmax WHERE cuitmax.PersonalId = per.PersonalId) 
        WHERE cuit.PersonalCUITCUILCUIT = @0 OR per.PersonalId IN (SELECT usu.UsuarioPersonalId FROM Usuario usu WHERE usu.UsuarioNombreLDAP = @1)
        `, [
        persona_cuit, userName
      ])
      const row = result[0]
      user.PersonalId = (row) ? row['PersonalId'] : 0

      const GrupoActividadList = await queryRunner.query(
        `SELECT DISTINCT ga.GrupoActividadId, g.GrupoActividadNumero
        -- , ga.GrupoActividadJerarquicoComo, 1
        FroM GrupoActividadJerarquico ga
        JOIN GrupoActividad g ON g.GrupoActividadId = ga.GrupoActividadId            
        WHERE
        ga.GrupoActividadJerarquicoPersonalId = @0 AND
        @1 > ga.GrupoActividadJerarquicoDesde AND @1 <  ISNULL(ga.GrupoActividadJerarquicoHasta, '9999-12-31')`,
        [user.PersonalId, new Date()]
      )

      // Agregar información de consulta como propiedad separada
      user.GrupoActividad = []
      for (const row of GrupoActividadList) {
        user.GrupoActividad.push({ GrupoActividadNumero: row.GrupoActividadNumero, GrupoActividadId: row.GrupoActividadId })
      }

      user.lastDbQueryTime = new Date()

      const jwtsecret = process.env.JWT_SECRET ? process.env.JWT_SECRET : "";
      const token = jsonwebtoken.sign(user, jwtsecret, {
        expiresIn: Number(process.env.JWT_EXPIRE_SECS),
      });
      //const tokenDecoded: any = decode(token);
      this.jsonRes({ token: token }, res);
    } catch (error) {
      await this.rollbackTransaction(queryRunner)
      return next(error)
    } finally {
      // you need to release query runner which is manually created:
      await queryRunner.release();
    }
    //  })
    //      .catch((error) => {
    //  return next(error);
    //});
  }

  refreshToken(req: any, res: any, next: NextFunction) {
    delete req.decoded_token.iat;
    delete req.decoded_token.exp;
    const jwtsecret = process.env.JWT_SECRET ? process.env.JWT_SECRET : "";
    const token = jsonwebtoken.sign(req.decoded_token, jwtsecret, {
      expiresIn: Number(process.env.JWT_EXPIRE_SECS) * 1000,
    });
    this.jsonRes({ token: token }, res);
  }
}
