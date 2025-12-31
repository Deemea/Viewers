import { fourUp } from './hps/fourUp';
import { main3D } from './hps/main3D';
import { mpr } from './hps/mpr';
import { mprAnd3DVolumeViewport } from './hps/mprAnd3DVolumeViewport';
import { only3D } from './hps/only3D';
import { primary3D } from './hps/primary3D';
import { primaryAxial } from './hps/primaryAxial';
import { frameView } from './hps/frameView';

function getHangingProtocolModule() {
  return [
    {
      name: mpr.id,
      protocol: mpr,
    },
    {
      name: primaryAxial.id,
      protocol: primaryAxial,
    },
  ];
}

export default getHangingProtocolModule;
