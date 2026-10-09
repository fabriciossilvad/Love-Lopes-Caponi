import { describe, expect, it } from 'vitest';
import { isRsvpOpen } from './RsvpCard';
describe('isRsvpOpen',()=>{
 it('allows answers before deadline',()=>expect(isRsvpOpen('2027-07-15T23:00:00Z',Date.parse('2027-07-15T22:00:00Z'))).toBe(true));
 it('blocks answers after deadline',()=>expect(isRsvpOpen('2027-07-15T23:00:00Z',Date.parse('2027-07-16T00:00:00Z'))).toBe(false));
 it('allows events without deadline',()=>expect(isRsvpOpen(null)).toBe(true));
});
