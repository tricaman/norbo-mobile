export type TabDirection = 'left' | 'right' | 'none';

let _direction: TabDirection = 'none';

export function setTabDirection(dir: TabDirection) {
  _direction = dir;
}

export function getTabDirection(): TabDirection {
  return _direction;
}
