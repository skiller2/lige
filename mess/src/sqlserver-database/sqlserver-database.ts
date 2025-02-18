import { MemoryDB } from '@builderbot/bot'
import { dataSource } from "../data-source";

class SqlServerAdapter extends MemoryDB {


    /**
     * Initializes the Firebase connection and checks for the existence of the specified table.
     * @returns {Promise<void>} - A Promise that resolves when the initialization is complete.
     */
  async init(): Promise<void> {

    }

    /**
     * Retrieves the previous entry based on the provided key.
     * @param {any} from - The key to start the search from.
     * @returns {Promise<any>} - A Promise that resolves with the previous entry.
     */
  getPrevByNumber = async (from: any) => {
    const res = await dataSource.query(`SELECT TOP 1 l.* FROM lige.dbo.bot_log l WHERE l.from_msg =  @0 ORDER BY stm DESC`, [from])
    if (res.length == 0)
      return undefined
    else 
      return ({stm:res[0].stm,ref:res[0].ref,keyword:res[0].keyword,answer:res[0].answer,refSerialize:res[0].refSerialize,from:res[0].from_msg,options:res[0].options});
    }

    /**
     * Saves data to the Firebase database.
     * @param {Object} ctx - The data to be saved.
     * @returns {Promise<void>} - A Promise that resolves when the data is successfully saved.
     */
    save = async (ctx: {
        ref: string
        keyword: string
        answer: any
        refSerialize: string
        from: string
        options: any
    }) => {
      const options_json = JSON.stringify(ctx.options)
      await dataSource.query(`INSERT INTO lige.dbo.bot_log (stm, ref, keyword, answer, refSerialize, from_msg, options)
        VALUES (@0,@1,@2,@3,@4,@5,@6)`,[new Date(), ctx.ref,ctx.keyword,ctx.answer,ctx.refSerialize,ctx.from,options_json])
    }

}

export { SqlServerAdapter }