import { getConnection, getManager, getRepository } from "typeorm";
import { NextFunction, Request, Response } from "express";
import { BaseController } from "./baseController";
import * as bcrypt from "bcryptjs";
import * as ldap from "ldapjs";
import { SearchOptions } from "ldapjs";
import * as jwt from "jsonwebtoken";

export class AuthController extends BaseController {
  constructor() {
    super("");
  }

  authUser(user: string, password: string) {
    return new Promise((resolve, reject) => {
      const client = ldap.createClient({
        url: process.env.LDAP_URL,
        reconnect: true,
      });
      client.bind(
        process.env.LDAP_USERNAME,
        process.env.LDAP_PASSWORD,
        (err) => {
          if (err) return reject(err);

          const opts: SearchOptions = {
            filter:
              "(&(objectClass=user)(|(mail=" +
              user +
              ")(sAMAccountName=" +
              user +
              ")))",
            scope: "sub",
            paged: true,
            sizeLimit: 200,
          };
          let object: any = null;
          client.search(process.env.LDAP_SEARCH, opts, (err, res) => {
            if (err) return reject(err);
            res.on("searchEntry", (entry) => {
              object = entry.object;
            });

            res.on("error", (err) => {
              client.destroy();
              reject(err);
            });
            res.on("end", (result) => {
              if (!object) {
                client.destroy();
                return reject(`Invalid user on ldap user ${user}`);
              }

              client.bind(object.dn, password, (err) => {
                if (err) {
                  client.destroy();
                  console.error("Invalid Login", err);
                  if (err.code == 49)
                    //NT_STATUS_LOGON_FAILURE
                    err.message =
                      "Las credenciales proporcionadas no son válidas";
                  return reject(err);
                }

                client.destroy();
                return resolve({
                  email: object.mail,
                  name: object.name,
                  username: object.sAMAccountName,
                });
              });
            });
          });
        }
      );
    });
  }

  encryptPassword(password: string) {
    const salt = bcrypt.getSalt("10");
    return bcrypt.hash(password, salt);
  }

  comparePassword(password: string, passwordReceived: string) {
    return bcrypt.compare(password, passwordReceived);
  }

  signup(res, req) {
    const con = getConnection();

    const data = {
      connected: false,
      database: "cofybcf",
      sqltest: {},
      random: Math.floor(Math.random() * (100000000000 + 1)),
    };

    con
      .query("SELECT 1 + @0", [1])
      .then((records) => {
        data.sqltest = records;
        data.connected = true;
        this.jsonRes(data, res);
        //        throw new Error("Forzado");
      })
      .catch((err) => {
        this.errRes(err, null, "Error accediendo a base de datos", 409);
      });
  }

  signin(res, req) {
    const con = getConnection();

    const { username, email, password } = req.body;

    this.authUser(username, password)
      .then((user: any) => {
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

        const token = jwt.sign(user, process.env.JWT_SECRET, {
          expiresIn: Number(process.env.JWT_EXPIRE_SECS),
        });

        const tokenDecoded: any = jwt.decode(token);
        this.jsonRes({ token: token }, res);
      })
      .catch((err) => {
        this.errRes(err, res, err.message, 409);
      });
  }

  refreshToken(res, req) {
    delete req.decoded_token.iat;
    delete req.decoded_token.exp;

    const token = jwt.sign(req.decoded_token, process.env.JWT_SECRET, {
      expiresIn: Number(process.env.JWT_EXPIRE_SECS) * 1000,
    });
    this.jsonRes({ token: token }, res);
  }
}
