import json

class Subscription:
    @staticmethod
    def create(customer, items):
        return {"id": "sub_123"}

    @staticmethod
    def delete(id):
        return {"id": id}


class Webhook:
    @staticmethod
    def construct_event(payload, sig, secret):
        return json.loads(payload.decode())
