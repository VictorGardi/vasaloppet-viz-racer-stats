import json
import requests
import multiprocessing
from pathlib import Path

from tqdm import tqdm
from scrapy.crawler import CrawlerProcess

from vasa_spider import VasalyticsSpider

# Update data paths to work with the Docker setup
# Data will be stored in a shared volume that both containers can access
DATA_ROOT = Path("/data")

EVENT_DATA_ROOT = DATA_ROOT / "events"
EVENT_DATA_ROOT.mkdir(parents=True, exist_ok=True)

INDEX_FILE = DATA_ROOT / "index.json"


def get_years():
    response = requests.get(
        "https://results.vasaloppet.se/index.php?content=ajax2&func=getSearchFields&options"
    )
    response.raise_for_status()
    return [
        str(item["v"][0])
        for item in response.json()["branches"]["lists"]["fields"]["event_main_group"][
            "data"
        ]
        if isinstance(item["v"][0], int)
    ]


def get_events(year: int):
    response = requests.get(
        f"https://results.vasaloppet.se/2025/index.php?content=ajax2&func=getSearchFields&options%5Bb%5D%5Blists%5D%5Bevent_main_group%5D={year}"
    )
    response.raise_for_status()
    return {
        item["v"][0]: item["v"][1]
        for item in response.json()["branches"]["lists"]["fields"]["event"]["data"]
    }


def run_crawler(year, event_id):

    # Ensure the year directory exists
    (EVENT_DATA_ROOT / str(year)).mkdir(exist_ok=True)

    feed_output_uri = f"file://{EVENT_DATA_ROOT / str(year) / f'{event_id}.json'}"

    process = CrawlerProcess(
        settings={
            "FEEDS": {
                feed_output_uri: {"format": "json", "overwrite": True},
            },
            "FEED_EXPORT_ENCODING": "utf-8",
            "ROBOTSTXT_OBEY": False,
            "LOG_LEVEL": "INFO",
        }
    )

    process.crawl(VasalyticsSpider, event_id)
    process.start()


if __name__ == "__main__":
    # Get all the years for which there is an event that we can scrape
    years = get_years()

    for year in years:
        events = get_events(year)

        print(f"Fetching data for all events during {year}")

        for event_id, event_name in tqdm(events.items()):
            if INDEX_FILE.exists():
                with INDEX_FILE.open(encoding="utf-8") as source:
                    index = json.load(source)
            else:
                index = {}

            # If event_id is not already in the index file, let's scrape this event
            if not index.get(year, {}).get(event_id):
                # Start scraping (run this in a separate Process to avoid problems with the twisted reactor not being restartable)
                p = multiprocessing.Process(target=run_crawler, args=(year, event_id))
                p.start()
                p.join()

                # Update index
                (index.setdefault(year, {}))[event_id] = event_name

                # And persist to disc
                with INDEX_FILE.open("w", encoding="utf-8") as target:
                    json.dump(
                        index, target, indent=4, sort_keys=True, ensure_ascii=False
                    ) 