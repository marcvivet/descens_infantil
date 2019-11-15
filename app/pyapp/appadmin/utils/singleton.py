class Singleton(type):
    _instance = None

    def __call__(cls, *args, **kwargs):
        singleton = kwargs.pop('singleton', True)

        if not singleton:
            return super(Singleton, cls).__call__(*args, **kwargs)

        if not cls._instance:
            cls._instance = \
                super(Singleton, cls).__call__(*args, **kwargs)
        
        # REMOVE THIS AT THE END
        # cls._instance.reload()
        return cls._instance