import YahooFinanceMiddleware from "../Middlewares/YahooFinanceMiddleware";
import StockModel from "../Models/StockModel";
import StockPriceModel from "../Models/StockPriceModel";
import ProcessHelperModel from "../Helpers/ProcessHelper";
//TODO - TEST
class StockHistoryTracker {
  constructor() {}

  pullAllPricesHistory = async () => {
    const stocks = await new StockModel().findAll();

    await Promise.all(
      stocks.map(async (s) => {
        var stockYFName = await new StockModel().getYahooFinanceStock(s); //TODO - Move to dependency
        if (stockYFName !== null) {
          var yfMiddleware = new YahooFinanceMiddleware(stockYFName.yfStockName);
          //TODO - THINK ABOUT IT
          var lastPrice = await new StockModel().getLastPrice(s); //TODO - Move to dependency
          if (lastPrice !== null) {
            var nextPriceDate = new Date();
            nextPriceDate.setDate(lastPrice.date.getDate() + 1);
            yfMiddleware.setStartDate(nextPriceDate);
          }
          const pi = await yfMiddleware.getPriceHistory();
          await ProcessHelperModel.batchProcess(pi, 50 /* TODO - remove hardcoded value*/, async (phd: any) => {
            await new StockPriceModel().persist({
              id: phd.id,
              date: phd.date,
              open: phd.open,
              close: phd.close,
              volume: phd.volume,
            });
          });
        }
      })
    );
  };
}

export = StockHistoryTracker;
