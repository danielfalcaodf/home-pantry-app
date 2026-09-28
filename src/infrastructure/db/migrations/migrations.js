import journal from './meta/_journal.json';
import m0000 from './0000_init.sql';
import m0001 from './0001_configuracao.sql';
import m0002 from './0002_compra_item_exclusao.sql';
import m0003 from './0003_compra_item_atualizar_preco.sql';
import m0004 from './0004_conversao-unidade-de-compra.sql';
import m0005 from './0005_reducao-unidades-un-kg.sql';

  export default {
    journal,
    migrations: {
      m0000,
m0001,
m0002,
m0003,
m0004,
m0005
    }
  }
  