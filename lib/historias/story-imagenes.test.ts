import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { photoStripeSourceText } from './story-imagenes';

describe('franjas de fotos', () => {
  it('lee el nombre, el lugar y la descripción de cada foto, y deja fuera el año', () => {
    const text = photoStripeSourceText([
      {
        titulo: 'La playa',
        lugar: 'Valparaíso',
        descripcion: 'Mi abuela riendo',
      },
      { nombre: 'La casa', lugar: 'Santiago', alt: 'El patio en verano' },
    ]);
    assert.equal(
      text,
      'La playa. Valparaíso. Mi abuela riendo\nLa casa. Santiago. El patio en verano'
    );
  });
});
