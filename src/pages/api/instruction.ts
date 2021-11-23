import db from '../../libs/db'

import type { NextApiRequest, NextApiResponse } from 'next'

const ID_LENGTH = 6
const ID_CHARS = 'abcdefghijklmnopqrstuvwxyz0123456789'

type Row = {
  id: string
  instruction: string
  done: number
}

const instructionExists = async (id: string): Promise<boolean> => {
  const results = await db.query<Row[]>(
    `SELECT *
    FROM \`instruction\`
    WHERE \`id\` = ?`,
    id
  )
  return results.length !== 0
}

const createInstruction = async (task = ''): Promise<string> => {
  let randId: string

  do {
    randId = $0.getRandomId(ID_LENGTH, ID_CHARS)
  } while (!instructionExists(randId))

  await db.query(
    `INSERT
    INTO \`instruction\` (\`id\`, \`instruction\`)
    VALUES (?, ?)`,
    [randId, task]
  )

  return randId
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
        return res.status(400).json({
          success: false,
          message: 'id format incorrect',
          data: null,
        })
      }

      const result = await db.query<Row[]>(
        `SELECT * FROM \`instruction\` WHERE \`id\` = ?`,
        id
      )

      if (result.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'id not found',
          data: null,
        })
      } else {
        return res.status(200).json({
          success: true,
          message: '',
          data: {
            instruction: result[0].instruction,
            done: result[0].done === 0 ? 0 : 1,
          },
        })
      }
    }

    if (req.method === 'POST') {
      const { status, instruction } = JSON.parse(req.body ?? '')

      if (id === '') {
        const randId = await createInstruction(instruction)

        return res.status(200).json({
          success: true,
          message: '',
          data: {
            id: randId,
          },
        })
      }

      if (id.match(/^[a-z0-9]{6}$/) === null) {
        return res.status(400).json({
          success: false,
          message: 'id format incorrect',
          data: null,
        })
      }

      if (status !== undefined && status in ['todo', 'current', 'done']) {
        await db.query(
          `UPDATE \`instruction\` SET \`status\` = ? WHERE \`id\` = ?`,
          [status, id]
        )
      } else {
        await db.query(
          `UPDATE \`instruction\` SET \`instruction\` = ? WHERE \`id\` = ?`,
          [instruction, id]
        )
      }

      return res.status(200).json({
        success: true,
        message: '',
        data: null,
      })
    }
  } catch (e) {
    return res.status(500).json({
      success: false,
      message: String(e),
      data: null,
    })
  }

  return res.status(405).json({
    success: false,
    message: 'Not allowed.',
    data: null,
  })
}

export { createInstruction, instructionExists }

export default handler
