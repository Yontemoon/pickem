/**
 * Type for a singular Fighter
 * @typedef {Object} TFighter
 * @property {number} id
 * @property {string} name
 * @property {string} href
 * @property {string | null} imageSrc
 * @property {string} winLos
 * @property {string} flagSrc
 *
 */

/**
 * @typedef {Object} TFight
 * @property {TFighter} redFighter
 * @property {TFighter} blueFighter
 * @property {TFightDetails} details
 * @property {TEvent} event
 */

/**
 * @typedef {Object} TFightDetails
 * @property {number | null} fightId
 * @property {number | null} weightClass
 * @property {number} boutNumber
 */

/**
 * Type for an Event
 * @typedef {Object} TEvent
 * @property {string} event_title
 * @property {string} date
 * @property {string} href
 * @property {string} id
 */
