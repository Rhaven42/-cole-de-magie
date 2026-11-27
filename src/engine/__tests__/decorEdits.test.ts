import {
  addedItems,
  addItem,
  countEdits,
  itemEdit,
  OUTDOOR,
  patchItem,
  resetArea,
  resetItem,
  setDecorEdits,
} from '../../data/decorEdits';

describe('Éditeur de décor', () => {
  beforeEach(() => setDecorEdits({}));

  it('déplace, masque et rétablit un objet d’origine', () => {
    patchItem('hall', 'd-clock', { x: 3, y: 4 });
    patchItem('hall', 'd-clock', { w: 30 });
    expect(itemEdit('hall', 'd-clock')).toEqual({ x: 3, y: 4, w: 30 });
    patchItem('hall', 'd-clock', { hidden: true });
    expect(itemEdit('hall', 'd-clock')?.hidden).toBe(true);
    resetItem('hall', 'd-clock');
    expect(itemEdit('hall', 'd-clock')).toBeUndefined();
  });

  it('ajoute, modifie puis supprime un objet', () => {
    const key = addItem(OUTDOOR, 'oak', 10, 12, 60);
    expect(addedItems(OUTDOOR)).toHaveLength(1);
    patchItem(OUTDOOR, key, { x: 11, flip: true });
    expect(addedItems(OUTDOOR)[0]).toMatchObject({ x: 11, y: 12, flip: true });
    expect(countEdits()).toBe(1);
    patchItem(OUTDOOR, key, { hidden: true });
    expect(addedItems(OUTDOOR)).toHaveLength(0);
  });

  it('remet une zone ou tout le décor d’origine', () => {
    addItem('hall', 'books', 1, 1, 20);
    addItem(OUTDOOR, 'oak', 1, 1, 20);
    resetArea('hall');
    expect(countEdits()).toBe(1);
    resetArea();
    expect(countEdits()).toBe(0);
  });
});
