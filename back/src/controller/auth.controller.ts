import { hash, compare, getSalt } from "bcryptjs";
//import { SearchOptions, createClient, SearchEntry,Control } from "ldapjs";
import { Attribute, Change, Client, Control, InvalidCredentialsError, SearchOptions } from 'ldapts';

import { sign, decode } from "jsonwebtoken";
import { dataSource } from "../data-source";
import { NextFunction, Request } from "express";

import { BaseController, ClientException } from "./baseController";

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


//      throw new ClientException("Fin",'locura')

      return {dn, groups, sAMAccountName, email, name, description}

    } catch (err) {
      if (err instanceof InvalidCredentialsError) {
        const extended = err.message.match(/AcceptSecurityContext (.*), data (.*),/)

        if (extended[2] == '52e')
          throw new ClientException("Las credenciales ingresadas no son válidas",err.message)
        if (extended[2] == '773')
          throw new ClientException("Debe actualizar la contraseña",err.message)
      }
      throw err
    }
  }



/*
  authUserjs(user: string, password: string) {
    return new Promise((resolve, reject) => {
      const url = process.env.LDAP_URL ? process.env.LDAP_URL : "";
      const client = createClient({
        url: [url],
        reconnect: false,
        connectTimeout: 5000,
        timeout: 5000,
        //
        tlsOptions: { rejectUnauthorized: false }
      },);
      client.on("error", (err: any) => {
        console.log('error', err)
        err.message = "Servicio de validación no disponible";
        return reject(err);
      });
 
      client.on("connect", (res: any) => { });
 
      const username = process.env.LDAP_USERNAME
        ? process.env.LDAP_USERNAME
        : "";
      const passowrd = process.env.LDAP_PASSWORD
        ? process.env.LDAP_PASSWORD
        : "";
 
      client.bind(
        username,
        passowrd,
 
        (err: any) => {
          //ifError(err);
          if (err) return reject(err);
        }
      );
 
      const samname = user.split("@")[0];
 
      const opts: SearchOptions = {
        filter: `(&(objectClass=user)(|(mail=${user})(sAMAccountName=${samname})))`,
        scope: "sub",
        //        attributes: ['dn', 'sn', 'cn', 'mail', 'name', 'sAMAccountName'],
        paged: false,
        sizeLimit: 0,
      };
      const ldapsearch = process.env.LDAP_SEARCH ? process.env.LDAP_SEARCH : "";
      client.search(ldapsearch, opts, (err: any, res: any) => {
        ifError(err);
 
 
        let userEntry: SearchEntry | null = null;
        res.on("searchEntry", (entry: SearchEntry) => {
          userEntry = entry;
        });
 
        res.on("error", (err: any) => {
          console.error("client.search", "error: " + err.message);
          err.message = "Servicio de validación no disponible";
        });
 
        res.on("end", (result: any) => {
//      console.log('res', result)
          if (!userEntry)
            return reject(new ClientException("Las credenciales ingresadas no son válidas"));
    
          const control = new Control({type: '1.3.6.1.4.1.42.2.27.8.5.1', criticality:false})
//          client.bind(userEntry.pojo.objectName, password, (err: any) => {
          
client.on('connectTimeout', () => {console.log('Errorrrrrrrr')})
      client.on('connectError', () => {console.log('Errorrrrrrrr')})
      client.on('connectRefused', () => {console.log('Errorrrrrrrr')})          
      client.on('error', (err) => {console.log('Errorrrrrrrr',err)})          
          client.bind(samname + '@finanzas', password, control, (err: any, res: any) => {
 
 
            console.log('loque', err,res)
    
//            client.destroy();
            if (err) {
              if (err.code == 49) { //NT_STATUS_LOGON_FAILURE
                return reject(new ClientException(`Las credenciales ingresadas no son válidas para el usuario ${samname}.`));
              }
              return reject(new ClientException("Las credenciales ingresadas no son válidas.."));
            }
 
            return resolve({
              email: userEntry.pojo.attributes
                .filter((f: { type: string }) => f.type == "mail")
                .map((m: any[]) => m.values)[0],
              name: userEntry.pojo.attributes
                .filter((f: { type: string }) => f.type == "name")
                .map((m: any[]) => m.values)[0],
              username: userEntry.pojo.attributes
                .filter((f: { type: string }) => f.type == "sAMAccountName")
                .map((m: any[]) => m.values)[0],
              description: userEntry.pojo.attributes
                .filter((f: { type: string }) => f.type == "description")
                .map((m: any[]) => m.values)[0],
              groups: userEntry.pojo.attributes
                .filter((f: { type: string }) => f.type == "memberOf")
                .map((m: any[]) => m.values),
            });
          });
 
          
          //if (result.status == 0) {
          //  const err: any = {
          //    message: "Las credenciales proporcionadas no son válidas"
          //  }
          //  return reject(err);
          // }
          
        });
      });
    });
  }
*/

encryptPassword(password: string) {
  const salt = getSalt("10");
  return hash(password, salt);
}

comparePassword(password: string, passwordReceived: string) {
  return compare(password, passwordReceived);
}

  async signin(req: Request, res: any, next: NextFunction) {
  const { userName, password } = req.body;
  const queryRunner = dataSource.createQueryRunner();

  try {
    let user: any = await this.authUser(userName, password)
    await queryRunner.connect();

    const persona_cuit = (user.description !== undefined && user.description.length > 0) ? user.description[0] : 0

    let result = await queryRunner.query(
      `SELECT per.PersonalId
      FROM Personal per
      JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = per.PersonalId AND cuit.PersonalCUITCUILId = ( SELECT MAX(cuitmax.PersonalCUITCUILId) FROM PersonalCUITCUIL cuitmax WHERE cuitmax.PersonalId = per.PersonalId) 
      WHERE cuit.PersonalCUITCUILCUIT = @0`, [
      persona_cuit,
    ])
    const row = result[0]
    user.PersonalId = (row) ? row['PersonalId'] : 0
    /*    
      this.authUser(userName, password)
        .then(async (user: any) => {
          console.log('user', user)
          const queryRunner = dataSource.createQueryRunner();
          await queryRunner.connect();
  
          let result = await queryRunner.query(
            `SELECT per.PersonalId
            FROM Personal per ON per.PersonalId = ade.PersonalId
            JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = per.PersonalId AND cuit.PersonalCUITCUILId = ( SELECT MAX(cuitmax.PersonalCUITCUILId) FROM PersonalCUITCUIL cuitmax WHERE cuitmax.PersonalId = per.PersonalId) 
            WHERE cuit.PersonalCUITCUILCUIT = @0`, [
            user.persona_cuit,
          ])
          user.PersonaId=0
          let row:any
          if ((row = result[0])) { 
            user.PersonaId = row['PersonalId']
          }
  
        })
        .catch((error) => {
          next(error)
        });
  */


    const jwtsecret = process.env.JWT_SECRET ? process.env.JWT_SECRET : "";
    const token = sign(user, jwtsecret, {
      expiresIn: Number(process.env.JWT_EXPIRE_SECS),
    });
    //console.log("jwt", jwt);
    //const tokenDecoded: any = decode(token);
    this.jsonRes({ token: token }, res);
  } catch (error) {
    //     if (queryRunner.isTransactionActive)
    //      await queryRunner.rollbackTransaction();
    next(error)
  } finally {
    // you need to release query runner which is manually created:
    await queryRunner.release();
  }
  //  })
  //      .catch((error) => {
  //  next(error);
  //});
}

refreshToken(req: any, res: any, next: NextFunction) {
  delete req.decoded_token.iat;
  delete req.decoded_token.exp;
  const jwtsecret = process.env.JWT_SECRET ? process.env.JWT_SECRET : "";
  const token = sign(req.decoded_token, jwtsecret, {
    expiresIn: Number(process.env.JWT_EXPIRE_SECS) * 1000,
  });
  this.jsonRes({ token: token }, res);
}
}
