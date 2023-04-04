import { Response } from "express";

export class BaseController {

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

}
