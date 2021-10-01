import * as db from '../../db'

import type { NextApiRequest, NextApiResponse } from 'next'

const ID_LENGTH = 6

type Row = {
  id: string
  instruction: string
}

const handler = async (
  req: NextApiRequest,
  res: NextApiResponse<
    API.BaseResponse<API.InstructionGET | API.InstructionPOST>
  >
): Promise<void> => {
  const id = String(req.query.id ?? '').toLowerCase()

  try {
    if (req.method === 'GET') {
      if (id.match(/^[a-z0-9]{6}$/) === null) {
        res.status(400).json({
          success: false,
          message: 'id format incorrect',
          data: null,
        })

        return
      }

      const result = await db.query<Row[]>(
        `SELECT * FROM \`instruction\` WHERE \`id\` = ?`,
        id
      )

      if (result.length === 0) {
        res.status(404).json({
          success: false,
          message: 'id not found',
          data: null,
        })
      } else {
        res.status(200).json({
          success: true,
          message: '',
          data: {
            instruction: result[0].instruction,
          },
        })
      }

      return
    }

    if (req.method === 'POST') {
      const ins = JSON.parse(req.body ?? '').instruction

      if (id === '') {
        let existing: Row[]
        let randId: string

        do {
          randId = (() => {
            let id = ''
            const set = 'abcdefghijklmnopqrstuvwxyz0123456789'
            const len = set.length
            for (let i = 0; i < ID_LENGTH; i++) {
              id += set.charAt(Math.floor(Math.random() * len))
            }
            return id
          })()

          existing = await db.query<Row[]>(
            `SELECT * FROM \`instruction\` WHERE \`id\` = '${randId}'`
          )
        } while (existing.length !== 0)

        await db.query(
          `INSERT INTO \`instruction\` (\`id\`, \`instruction\`) VALUES ('${randId}', ?)`,
          ins
        )

        res.status(200).json({
          success: true,
          message: '',
          data: {
            id: randId,
          },
        })

        return
      }

      if (id.match(/^[a-z0-9]{6}$/) === null) {
        res.status(400).json({
          success: false,
          message: 'id format incorrect',
          data: null,
        })

        return
      }

      await db.query<Row[]>(
        `UPDATE \`instruction\` SET \`instruction\` = ? WHERE \`id\` = '${id}'`,
        ins
      )

      res.status(200).json({
        success: true,
        message: '',
        data: null,
      })

      return
    }
  } catch (e) {
    res.status(500).json({
      success: false,
      message: (e as Error).message,
      data: null,
    })
  }

  res.status(405)
}

export default handler
