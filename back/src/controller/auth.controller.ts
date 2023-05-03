import { BaseController } from "./baseController";
import * as bcrypt from "bcryptjs";
//import * from "ldapjs";
import { SearchOptions, createClient, SearchEntry } from "ldapjs";
import jwt from "jsonwebtoken";
import assert = require("assert");
import { dataSource } from "../data-source";
import { Request } from "express";

export class AuthController extends BaseController {
  authUser(user: string, password: string) {
    return new Promise((resolve, reject) => {
      const url = process.env.LDAP_URL ? process.env.LDAP_URL : "";
      const client = createClient({
        url: [url],
        reconnect: false,
        connectTimeout: 5000,
        timeout: 5000,
      });
      client.on("connectError", (err: any) => {
        err.message = "Servicio de validación no disponible";
        return reject(err);
      });

      client.on("connect", (res: any) => {});

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
          assert.ifError(err);
          //          if (err) return reject(err);
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
        assert.ifError(err);
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
              message: "Las credenciales proporcionadas no son válidas",
            };
            return reject(err);
          }

          client.bind(userEntry.pojo.objectName, password, (err: any) => {
            client.destroy();
            if (err) {
              if (err.code == 49)
                //NT_STATUS_LOGON_FAILURE
                err.message = "Las credenciales proporcionadas no son válidas";
              return reject(err);
              assert.ifError(err);
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
            });
          });

          /*
          if (result.status == 0) {
            const err: any = {
              message: "Las credenciales proporcionadas no son válidas 2"
            }
            return reject(err);
          }
          */
        });
      });
    });
  }

  encryptPassword(password: string) {
    const salt = bcrypt.getSalt("10");
    return bcrypt.hash(password, salt);
  }

  comparePassword(password: string, passwordReceived: string) {
    return bcrypt.compare(password, passwordReceived);
  }

  signin(res: any, req: Request) {
    const { userName, password } = req.body;

    this.authUser(userName, password)
      .then((user: any) => {
        /*
        con
          .query("SELECT nombre,legajo FROM Usuarios WHERE nombre = @0", [
            user.username,
          ])
          .then((records) => {
            if (records.length != 1) {
              this.errRes(res, null, "Usuario no encontrado", 409);
            } else {
            }
            // Armo el token
            //jwt.sign

            //        this.jsonRes(records, res);
            //      throw new Error("Forzado");
          })
          .catch((err) => {
            this.errRes(err, res, "Error accediendo a base de datos", 409);
          });
*/
        const jwtsecret = process.env.JWT_SECRET ? process.env.JWT_SECRET : "";
        const token = jwt.sign(user, jwtsecret, {
          expiresIn: Number(process.env.JWT_EXPIRE_SECS),
        });
        console.log("jwt", jwt);
        const tokenDecoded: any = jwt.decode(token);
        this.jsonRes({ token: token }, res);
      })
      .catch((err) => {
        this.errRes(err, res, err.message, 409);
      });
  }

  refreshToken(res: any, req: any) {
    delete req.decoded_token.iat;
    delete req.decoded_token.exp;
    const jwtsecret = process.env.JWT_SECRET ? process.env.JWT_SECRET : "";
    const token = jwt.sign(req.decoded_token, jwtsecret, {
      expiresIn: Number(process.env.JWT_EXPIRE_SECS) * 1000,
    });
    this.jsonRes({ token: token }, res);
  }
}
