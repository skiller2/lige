import { MemoryDB } from '@builderbot/bot'
import { dataSource } from "../data-source";
import { rejects, throws } from 'node:assert';
import { DBServer } from 'src/server';
import { dbServer } from 'src';

class SqlServerAdapter extends MemoryDB {
  public listHistory: any[] = []


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
  async getPrevByNumber(from: string): Promise<any> {
    const lastRow = this.listHistory[from] 
    if (lastRow)
      return lastRow
    else {
      const res = await dbServer.dataSource.query(`SELECT TOP 1 l.* FROM lige.dbo.bot_log l WHERE l.from_msg = @0 AND l.keyword IS NOT NULL ORDER BY stm DESC`, [from])
      const row = res[0] ? { stm: res[0].stm, ref: res[0].ref, keyword: res[0].keyword, answer: res[0].answer, refSerialize: res[0].refSerialize, from: res[0].from_msg, options: JSON.parse(res[0].options) } : {}
      return row
    }
  }

  /**
   * Saves data to the Firebase database.
   * @param {Object} ctx - The data to be saved.
   * @returns {Promise<void>} - A Promise that resolves when the data is successfully saved.
   */
  async save(ctx: any): Promise<void> {
    if (ctx.keyword)
      this.listHistory[ctx.from] = ctx
    
    const options_json = ctx.options ? JSON.stringify(ctx.options) : null
    let finished=false
    while (!finished) {
      try {
        await dbServer.dataSource.query(`INSERT INTO lige.dbo.bot_log (stm, ref, keyword, answer, refSerialize, from_msg, options)
        VALUES (@0,@1,@2,@3,@4,@5,@6)`, [new Date(), ctx.ref, ctx.keyword, ctx.answer, ctx.refSerialize, ctx.from, options_json])
        finished=true
      } catch (error) { 
        finished=false
      }
    }
  }

}

export { SqlServerAdapter }