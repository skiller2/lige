import { MemoryDB } from '@builderbot/bot'
import { dbServer } from '../index.ts';

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
      const res = await dbServer.dataSource.query(`SELECT TOP 1 l.Stm, l.Ref, l.Keyword, l.Answer, l.RefSerialize, l.FromMsg, l.Options FROM BotLog l WHERE l.FromMsg = @0 AND l.Keyword IS NOT NULL ORDER BY Stm DESC`, [from])
      const row = res[0] ? { stm: res[0].Stm, ref: res[0].Ref, keyword: res[0].Keyword, answer: res[0].Answer, refSerialize: res[0].RefSerialize, from: res[0].FromMsg, options: JSON.parse(res[0].Options) } : {}
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
        await dbServer.dataSource.query(`INSERT INTO BotLog (Stm, Ref, Keyword, Answer, RefSerialize, FromMsg, Options)
        VALUES (@0,@1,@2,@3,@4,@5,@6)`, [new Date(), ctx.ref, ctx.keyword, ctx.answer, ctx.refSerialize, ctx.from, options_json])
        finished=true
      } catch (error) { 
        finished=false
      }
    }
  }

}

export { SqlServerAdapter }