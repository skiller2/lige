import { Response } from "express";
import {
  DataSource, getRepository,
} from "typeorm";
import { dbServer } from "..";
import { DBServer } from "../server";
//import { env } from '../environment/env';
//import { IModel } from '../interfaces/IModel';
//import { IPopulate } from '../interfaces/IPopulate';

export interface IModel {
  //  mongooseModel: mongoose.Model<any>;
  create<T>(document: any): Promise<T>;
  find(populate?: IPopulate): Promise<any[]>;
  findById<T>(id: string, populate?: IPopulate): Promise<T>;
  findOne<T>(query: any, populate?: IPopulate): Promise<T>;
  findMany<T>(query: any, populate?: IPopulate): Promise<any[] | T>;
  updateById<T>(
    id: string,
    document: any,
    populate?: IPopulate | IPopulate[]
  ): Promise<T>;
  deleteById<T>(id: string): Promise<T>;
}

export interface IPopulate {
  path: string;
  model?: string;
  populate?: IPopulate;
}
/**
 * Provides functions to be used with express routes. Serves common CRUD fuctionality.
 */
export class BaseController {
  public useModReturnNew = { useFindAndModify: false, new: true };
  public repository = null;
  private entity = null;
  public ds:DataSource
  constructor(entity: any) {
    this.ds = dbServer.dataSource
    if (entity)
    this.entity = entity;
  }
  /**
   * Sends the document as JSON in the body of response, and sets status to 200
   * @param recordset the Database recordset to be returned to the client as JSON
   * @param res the response object that will be used to send http response
   */
  jsonRes(recordset: any, res: Response) {
    res.status(200).json({ msg:"ok", data:recordset });
  }
  /**
   * @param err error object of any type genereated by the system
   * @param res response object to be used to to send
   * @param message custom response message to be provided to the client in a JSON body response ({error:'message'})
   * @param status custom status code, defaults to 500
   */
  errRes(err: any, res: Response, message = "error", status = 500) {

    if (process.env.DEBUG) {
      console.error(err);
    }
    res.status(status).json({ msg: message, data: [] });
  }

  getTable() {
    if (!this.repository) this.repository = getRepository(this.entity);
  }


  /**
   * Creates a new document
   */
  /*
    create(res: Response, document: any, populate?: IPopulate, errMsg = 'Failed to create') {
        this.repository.create<mongoose.Document>(document).then((doc: mongoose.Document) => {
            if (populate) {
                doc.populate(populate).execPopulate().then(populatedDoc => {
                    this.jsonRes(populatedDoc, res)
                }).catch(err => { this.errRes(err, res, errMsg) })
            } else {
                this.jsonRes(doc, res)
            }
        }).catch(err => { this.errRes(err, res, errMsg) })
    }
  */
  /**
   * Returns all documents of model
   */
  find(
    res: Response,
    populate?: IPopulate,
    errMsg = "Failed to find documents"
  ) {
    this.getTable();

    this.repository.find().then(
      (data) => {
        this.jsonRes(data, res);
      },
      (err) => {
        this.errRes(err, res, errMsg,409);
      }
    );
  }
  /**
   * Returns single doucument of model specified by _id.
   */
  findById(
    res: Response,
    documentId: string,
    populate?: IPopulate,
    errMsg = `Failed to find document ${documentId}`
  ) {
    this.repository
      .findById(documentId, populate)
      .then(
        (doc) => {
          this.jsonRes(doc, res);
        },
        (err) => {
          this.errRes(err, res, errMsg,409);
        }
      )
      .catch((err) => {
        this.errRes(err, res, "Failed to retrieve doc",409);
      });
  }
  /**
   * Returns single document from given model that matches the query.
   */
  findOne(
    res: Response,
    query: any,
    populate?: IPopulate,
    errMsg = `Failed to find document ${query}`
  ) {
    this.repository.findOne(query, populate).then(
      (doc) => {
        this.jsonRes(doc, res);
      },
      (err) => {
        this.errRes(err, res, errMsg,409);
      }
    );
  }
  findMany(
    res: Response,
    query: any,
    populate?: IPopulate,
    errMsg = `Failed to find document ${query}`
  ) {
    this.repository.findMany(query, populate).then(
      (doc) => {
        this.jsonRes(doc, res);
      },
      (err) => {
        this.errRes(err, res, errMsg,409);
      }
    );
  }

  /**
   * Updates single document,
   */
  updateById(
    res: Response,
    documentId: string,
    document: any,
    populate?: IPopulate | IPopulate[],
    errMsg = `Failed to update document ${documentId}`
  ) {
    this.repository.updateById(documentId, document, populate).then(
      (doc) => {
        this.jsonRes(doc, res);
      },
      (err) => {
        this.errRes(err, res, errMsg,409);
      }
    );
  }
  /**
   * Deletes a single document selected by id
   */
  deleteById(
    res: Response,
    documentId: string,
    errMsg = `Failed to delete document ${documentId}`
  ) {
    this.repository.deleteById(documentId).then(
      (doc) => {
        this.jsonRes(doc, res);
      },
      (err) => {
        this.errRes(err, res, errMsg,409);
      }
    );
  }
}
