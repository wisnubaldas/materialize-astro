import uvicorn

from app.utils.env import ENV

print(ENV.APP_URL)


def main():
    uvicorn.run("app.main:app", host=ENV.APP_URL, port=ENV.APP_PORT, reload=True)


if __name__ == "__main__":
    main()
