import { hash, compare, getSalt } from "bcryptjs";
import { SearchOptions, createClient, SearchEntry } from "ldapjs/lib";
import { sign, decode } from "jsonwebtoken";
import { dataSource } from "../data-source";
import { Request } from "express";
import { ifError } from "assert";

import { BaseController } from "./baseController";

export class AuthController extends BaseController {
  authUser(user: string, password: string) {
    return new Promise((resolve, reject) => {
      const url = process.env.LDAP_URL ? process.env.LDAP_URL : "";
      const client = createClient({
        url: [url],
        reconnect: false,
        connectTimeout: 5000,
        timeout: 5000,
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
          if (!userEntry) {
            const err = {
              message: "2. Las credenciales proporcionadas no son válidas",
            };
            return reject(err);
          }

          client.bind(userEntry.pojo.objectName, password, (err: any) => {
            client.destroy();
            if (err) {
              if (err.code == 49)
                //NT_STATUS_LOGON_FAILURE
                err.message = "1. Las credenciales proporcionadas no son válidas";
              return reject(err);
              ifError(err);
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

          /*
          if (result.status == 0) {
            const err: any = {
              message: "Las credenciales proporcionadas no son válidas"
            }
            return reject(err);
          }
          */
        });
      });
    });
  }

  encryptPassword(password: string) {
    const salt = getSalt("10");
    return hash(password, salt);
  }

  comparePassword(password: string, passwordReceived: string) {
    return compare(password, passwordReceived);
  }

  async signin(res: any, req: Request) {
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
          .catch((err) => {
            this.errRes(err, res, "Error accediendo a base de datos", 409);
          });
    */


      console.log('payload', user)
      const jwtsecret = process.env.JWT_SECRET ? process.env.JWT_SECRET : "";
      const token = sign(user, jwtsecret, {
        expiresIn: Number(process.env.JWT_EXPIRE_SECS),
      });
      //console.log("jwt", jwt);
      //const tokenDecoded: any = decode(token);
      this.jsonRes({ token: token }, res);
    } catch (err) {
      //      let def = { message: "Error accediendo a la base de datos" };
      //      if (typeof def === "string") def = err;
      //     if (queryRunner.isTransactionActive)
      //      await queryRunner.rollbackTransaction();
      this.errRes(err, res, err.message, 409);
    } finally {
      // you need to release query runner which is manually created:
      await queryRunner.release();
    }
    //  })
    //      .catch((err) => {
    //  this.errRes(err, res, err.message, 409);
    //});
  }

  refreshToken(res: any, req: any) {
    delete req.decoded_token.iat;
    delete req.decoded_token.exp;
    const jwtsecret = process.env.JWT_SECRET ? process.env.JWT_SECRET : "";
    const token = sign(req.decoded_token, jwtsecret, {
      expiresIn: Number(process.env.JWT_EXPIRE_SECS) * 1000,
    });
    this.jsonRes({ token: token }, res);
  }
}
