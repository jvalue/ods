import { getISODateString, getISOTimeString } from '@/helpers/date-helpers'

describe('#getISOTimeString', () => {
  it('should return a date\'s minutes and hours as "hh:mm"', () => {
    const date1 = new Date('2020-12-5 14:45')
    const date2 = new Date('2020-12-5 14:4')
    const date3 = new Date('2020-12-5 4:15')
    const date4 = new Date('2020-12-5 4:4')

    const date1Actual = getISOTimeString(date1)
    const date2Actual = getISOTimeString(date2)
    const date3Actual = getISOTimeString(date3)
    const date4Actual = getISOTimeString(date4)

    expect(date1Actual).toEqual('14:45')
    expect(date2Actual).toEqual('14:04')
    expect(date3Actual).toEqual('04:15')
    expect(date4Actual).toEqual('04:04')
  })
})

describe('#getISODateString', () => {
  it('should return a date as "YYYY-MM-DD"', () => {
    const date1 = new Date('2020-12-5')
    const date2 = new Date('2020-1-5')

    const date1Actual = getISODateString(date1)
    const date2Actual = getISODateString(date2)

    expect(date1Actual).toEqual('2020-12-05')
    expect(date2Actual).toEqual('2020-01-05')
  })
})
