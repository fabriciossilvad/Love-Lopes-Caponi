import { describe, expect, it } from 'vitest';
import { carouselWindow } from './HomePhotoCarousel';

describe('home photo carousel window',()=>{
 it('shows three photos initially',()=>{
  expect(carouselWindow(['a','b','c','d','e'],0,3)).toEqual(['a','b','c']);
 });
 it('wraps around without leaving blank slots',()=>{
  expect(carouselWindow(['a','b','c','d','e'],4,3)).toEqual(['e','a','b']);
 });
 it('does not duplicate photos if fewer than three exist',()=>{
  expect(carouselWindow(['a','b'],0,3)).toEqual(['a','b']);
 });
 it('supports an empty gallery',()=>{
  expect(carouselWindow([],0,3)).toEqual([]);
 });
});
