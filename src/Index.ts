import fs from 'fs'
import betterLogging from "better-logging"
import YAML from 'yaml'
import axios, { AxiosResponse } from 'axios'
import mysql from 'mysql'

betterLogging(console);

let config: Object = YAML.parse(fs.readFileSync('settings.yml', 'utf8'));
const URL: string = config['url']
const databaseConfig: Object = config['db']
const connection: any = mysql.createConnection({
  host: databaseConfig['host'],
  user: databaseConfig['user'],
  password: databaseConfig['password'],
  database: databaseConfig['database']
})

const today = (): string => {
  let date = new Date()
  let year = date.getFullYear()
  let month = date.getMonth() + 1
  let day = date.getDate()

  return `${year}-${month}-${day}`
}

const escapeString = (rawString): string => {
  return rawString.replace(/"/g, '\\"')
}

(async () => {

  connection.connect()

  let response: AxiosResponse<any> = await axios.get(URL)
  let countries: Array<Object> = response.data
  countries.forEach((element: Stats) => {
    connection.query(`INSERT INTO daily_stats VALUES(0, "${escapeString(element.country)}", "${today()}", ${element.todayCases}, ${element.todayDeaths}, CURRENT_TIMESTAMP, NULL) ON DUPLICATE KEY UPDATE cases=${element.todayCases}, deaths=${element.todayDeaths}, updated_at=CURRENT_TIMESTAMP`, (error, results, fields) => {
      if (error) throw error
      console.log(`affectedRows: ${results.affectedRows}, insertId: ${results.insertId}`)
    })
  });

  connection.end()

})()
